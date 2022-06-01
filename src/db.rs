#![allow(unused)]

pub mod database {
    use std::collections::BTreeMap;

    use mysql::{prelude::*, *};

    use crate::core::structs::{Category, DbCredentials, Entry, Item, ItemDetails};

    pub fn collect_categories(conn: &mut PooledConn) -> Vec<Category> {
        /// Get all categories from the database.
        conn.query("SELECT * FROM category ORDER BY title").unwrap()
    }

    pub fn collect_items(conn: &mut PooledConn) -> BTreeMap<u32, Item> {
        /// Get all items from the database.
        /// Returns a BTreeMap to preserve order of insertion.
        let mut items: Vec<Item> = conn.query("SELECT * FROM item").unwrap();

        // get vector of most recent entries for each item
        let mut details_list: Vec<ItemDetails> = Vec::new();
        for item in items.iter() {
            let details: ItemDetails = match conn
                .exec_first(
                    r"
                    SELECT cost, note, status, visible, removed
                    FROM entry WHERE item_id = :item_id ORDER BY id DESC
                    ",
                    params! {
                        "item_id" => item.id,
                    },
                )
                .unwrap()
            {
                Some(details) => details,
                None => ItemDetails::new(),
            };

            details_list.push(details);
        }

        let mut result: BTreeMap<u32, Item> = BTreeMap::new();
        for (item, details) in items.iter_mut().zip(details_list.iter()) {
            item.details = Some(details.clone());
            result.insert(item.id.unwrap(), item.clone());
        }

        result
    }

    pub fn collect_item_entries(conn: &mut PooledConn, item_id: &str) -> Vec<Entry> {
        /// Get all entries from the database.
        /// Returns a Vector of Entry.
        let mut entries: Vec<Entry> = conn
            .query(&format!("SELECT * FROM entry WHERE item_id = {}", item_id))
            .unwrap();

        entries
    }

    pub fn connect(credentials: &DbCredentials) -> Result<mysql::PooledConn> {
        /// Get options from url and create a pooled connection
        let opts = Opts::from_url(&credentials.mysql_url())?;
        let pool = Pool::new(opts)?;

        match pool.get_conn() {
            Ok(conn) => Ok(conn),
            Err(e) => Err(e),
        }
    }

    pub fn delete_category(conn: &mut PooledConn, id: u32) {
        /// Delete a category from the database.
        let result = conn
            .exec_drop(
                r"
                UPDATE category
                SET removed = 1
                WHERE id = :id;
                ",
                params! {
                    "id" => id,
                },
            )
            .unwrap();
    }

    pub fn delete_item(conn: &mut PooledConn, item_id: u32) -> Result<()> {
        /// Delete a category from the database.
        conn.exec_drop(
            r"
            UPDATE entry
            SET removed = 1
            WHERE item_id = :item_id;
            ",
            params! {
                "item_id" => item_id,
            },
        )
    }

    pub fn get_autoincremented_id(conn: &mut PooledConn, table_name: &str) -> u32 {
        /// Get the autoincremented id of the last inserted row.
        let new_id: u32 = conn
            .query(format!(
                "SELECT id FROM {} ORDER BY id DESC LIMIT 1",
                table_name
            ))
            .unwrap()[0];
        // update original item's id

        new_id
    }

    pub fn insert_category(conn: &mut PooledConn, title: &str) -> Result<()> {
        /// Insert a category into the database.
        conn.query_drop(format!(
            "INSERT INTO category (title, removed) VALUES ('{}', 0)",
            title
        ))
    }

    pub fn insert_entry(conn: &mut PooledConn, item: &Item) -> Result<()> {
        /// Insert an entry into the database.
        let details = item.details.as_ref().unwrap();
        conn.exec_drop(
            r"
            INSERT INTO entry (item_id, cost, note, status, visible, removed)
            VALUES (
                :item_id,
                :cost,
                :note,
                :status,
                :visible,
                :removed
            );
            ",
            params! {
                "item_id" => item.id,
                "cost" => details.cost,
                "note" => &details.note,
                "status" => details.status,
                "visible" => details.visible,
                "removed" => details.removed,
            },
        )
    }

    pub fn insert_item(conn: &mut PooledConn, item: &mut Item) -> Result<()> {
        /// Insert an item into the database.
        let details = item.details.as_ref().unwrap();
        println!("{:?}", details);

        conn.exec_drop(
            r"INSERT INTO item (title, category_id)
            VALUES (
                :title,
                :category_id
            );
            ",
            params! {
                "title" => &item.title,
                "category_id" => item.category_id,
            },
        )?;

        item.id = Some(get_autoincremented_id(conn, "item"));

        conn.exec_drop(
            r"INSERT INTO entry (item_id, cost, note, status, visible, removed)
            VALUES (
                :item_id,
                :cost,
                :note,
                :status,
                :visible,
                :removed
            );
            ",
            params! {
                "item_id" => item.id,
                "cost" => details.cost,
                "note" => &details.note,
                "status" => details.status,
                "visible" => details.visible,
                "removed" => details.removed,
            },
        )?;

        Ok(())
    }

    pub fn title_exists(conn: &mut PooledConn, title: &str, db_name: &str) -> bool {
        /// Check if a title already exists in the database.
        let mut result: Vec<u32> = conn
            .query(format!(
                "SELECT id FROM {} WHERE title = '{}'",
                db_name, title
            ))
            .unwrap();

        result.len() > 0
    }

    pub fn test_auth(credentials: &DbCredentials) -> Result<()> {
        match connect(&credentials) {
            Ok(_) => Ok(()),
            Err(e) => Err(e),
        }
    }

    pub fn update_item(conn: &mut PooledConn, item: &Item) -> Result<()> {
        /// Update an item in the database.
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
        insert_entry(conn, item)
    }
}
