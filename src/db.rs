#![allow(unused)]

pub mod database {
    use std::collections::BTreeMap;

    use mysql::{prelude::*, *};

    use crate::core::structs::{Category, Item, ItemDetails, Entry};

    pub fn collect_categories(conn: &mut PooledConn) -> Vec<Category> {
        /// Get all categories from the database.
        conn.query("SELECT * FROM category").unwrap()
    }

    pub fn collect_items(conn: &mut PooledConn) -> BTreeMap<u32, Item> {
        /// Get all items from the database.
        /// Returns a BTreeMap to preserve order of insertion.
        let mut items: Vec<Item> = conn.query("SELECT * FROM item").unwrap();

        // get vector of most recent entries for each item
        let mut details_list: Vec<ItemDetails> = Vec::new();
        for item in items.iter() {
            let details: ItemDetails = conn
                .exec_first(
                    r"
                    SELECT cost, note, statdesc, status, visible
                    FROM entry WHERE item_id = :item_id ORDER BY id DESC
                    ",
                    params! {
                        "item_id" => item.id,
                    },
                )
                .unwrap()
                .unwrap();

            details_list.push(details);
        }

        let mut result: BTreeMap<u32, Item> = BTreeMap::new();
        for (item, details) in items.iter_mut().zip(details_list.iter()) {
            item.details = Some(details.clone());
            result.insert(item.id.unwrap(), item.clone());
        }

        result
    }

    pub fn collect_entry_by_item(conn: &mut PooledConn, item_id: &str) -> Vec<Entry> {
        /// Get all items from the database.
        /// Returns a BTreeMap to preserve order of insertion.
        let mut entries: Vec<Entry> = conn.query(&format!("SELECT * FROM entry WHERE item_id = {}", item_id)).unwrap();

        entries
    }

    pub fn connect(url: String) -> Result<mysql::PooledConn> {
        /// Get options from url and create a pooled connection
        let opts = Opts::from_url(&url)?;
        let pool = Pool::new(opts)?;

        Ok(pool.get_conn()?)
    }

    // TODO: Add GUI options for this function which is currently unused.
    pub fn insert_category(conn: &mut PooledConn, title: &str) -> Result<()> {
        /// Insert a category into the database.
        conn.query_drop(format!("INSERT INTO category (title) VALUES ('{}')", title))
    }

    // TODO: Add GUI options for this function which is currently unused.
    pub fn insert_item(conn: &mut PooledConn, item: &mut Item) -> Result<()> {
        /// Insert an item into the database.
        let details = item.details.as_ref().unwrap();

        conn.exec_drop(
            r"INSERT INTO item (title, category_id)
            VALUES (
                :title,
                :category_id,
                :cost
            );
            
            INSERT INTO entry (item_id, cost, note, statdesc, status, visible)
            VALUES (
                :item_id,
                :cost,
                :note,
                :statdesc,
                :status,
                :visible
            )",
            params! {
                "title" => &item.title,
                "category_id" => item.category_id,
                "item_id" => item.id,
                "cost" => details.cost,
                "note" => &details.note,
                "statdesc" => &details.statdesc,
                "status" => details.status,
                "visible" => details.visible,
            },
        )?;

        // get ID of new item
        let auto_incremented_id: u32 = conn
            .query("SELECT id FROM item ORDER BY id DESC LIMIT 1")
            .unwrap()[0];

        // update original item's id
        item.id = Some(auto_incremented_id);

        Ok(())
    }

    pub fn update_item(conn: &mut PooledConn, item: &Item) -> Result<()> {
        /// Update an item in the database.
        // TODO: Add GUI options for this part which currently does nothing.
        conn.exec_drop(
            r"
            UPDATE item
            SET title = :title,
            category_id = :category_id
            WHERE id = :id;
            ",
            params! {
                "id" => item.id,
                "title" => &item.title,
                "category_id" => item.category_id,
            },
        );

        // create a new entry with updated information
        let details = item.details.as_ref().unwrap();
        conn.exec_drop(
            r"
            INSERT INTO entry (item_id, cost, note, statdesc, status, visible)
            VALUES (
                :item_id,
                :cost,
                :note,
                :statdesc,
                :status,
                :visible
            );
            ",
            params! {
                "item_id" => item.id,
                "cost" => details.cost,
                "note" => &details.note,
                "statdesc" => &details.statdesc,
                "status" => details.status,
                "visible" => details.visible,
            },
        )
    }
}
