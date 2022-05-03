#![allow(unused)]

pub mod database {
    use std::collections::BTreeMap;

    use mysql::{prelude::*, *};

    use crate::core::structs::{Category, Item};

    pub fn collect_categories(conn: &mut PooledConn) -> Vec<Category> {
        conn.query("SELECT * FROM category").unwrap()
    }

    pub fn collect_items(conn: &mut PooledConn) -> BTreeMap<u32, Item> {
        /// get collection of items in database
        let items: Vec<Item> = conn.query("SELECT * FROM item").unwrap();
        let mut result: BTreeMap<u32, Item> = BTreeMap::new();

        for item in items.iter() {
            result.insert(item.id.unwrap(), item.clone());
        }

        result
    }

    pub fn connect(url: String) -> Result<mysql::PooledConn> {
        /// get options from url and create a pooled connection
        let opts = Opts::from_url(&url)?;
        let pool = Pool::new(opts)?;

        Ok(pool.get_conn()?)
    }

    pub fn insert_category(conn: &mut PooledConn, title: &str) -> Result<()> {
        /// insert a category into the database
        conn.query_drop(format!("INSERT INTO category (title) VALUES ('{}')", title))
    }

    pub fn insert_item(conn: &mut PooledConn, item: &mut Item) -> Result<()> {
        /// insert an item into the database
        conn.exec_drop(
            r"INSERT INTO item (title, category_id, cost, note, status, statdesc, hidden)
            VALUES (
                :title,
                :category_id,
                :cost,
                :note,
                :status,
                :statdesc,
                :hidden
            )",
            params! {
                "title" => &item.title,
                "category_id" => item.category_id,
                "cost" => item.cost,
                "note" => &item.note,
                "status" => item.status,
                "statdesc" => &item.statdesc,
                "hidden" => item.hidden,
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
        /// update an item in the database
        conn.exec_drop(
            r"
                UPDATE item
                SET title = :title,
                    category_id = :category_id,
                    cost = :cost,
                    note = :note,
                    status = :status,
                    statdesc = :statdesc,
                    hidden = :hidden
                WHERE id = :id
            ",
            params! {
                "id" => item.id,
                "title" => &item.title,
                "category_id" => item.category_id,
                "cost" => item.cost,
                "note" => &item.note,
                "status" => item.status,
                "statdesc" => &item.statdesc,
                "hidden" => item.hidden,
            },
        )
    }
}
