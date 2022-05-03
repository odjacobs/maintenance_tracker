#![allow(unused)]

pub mod structs {
    use std::collections::HashMap;

    use mysql::prelude::*;
    use mysql::{FromRowError, FromValueError, Row, Value};
    use serde::{Deserialize, Serialize};

    #[derive(Debug, PartialEq, Eq)]
    pub struct Category {
        pub id: u32,
        pub title: String,
    }

    impl FromRow for Category {
        fn from_row_opt(row: Row) -> Result<Category, FromRowError> {
            let mut row = row;

            let result = Category {
                id: row.take("id").unwrap(),
                title: row.take("title").unwrap(),
            };

            Ok(result)
        }
    }

    #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
    pub struct Item {
        pub id: Option<u32>,
        pub title: String,
        pub category_id: u32,
        pub cost: Option<u32>,
        pub note: Option<String>,
        pub status: u8,
        pub statdesc: Option<String>,
        pub hidden: bool,
    }

    impl Item {
        pub fn new(title: String, category_id: u32) -> Item {
            Item {
                id: None,
                title: title,
                category_id: category_id,
                cost: None,
                note: None,
                status: 0,
                statdesc: None,
                hidden: false,
            }
        }
    }

    impl FromRow for Item {
        fn from_row_opt(row: Row) -> Result<Item, FromRowError> {
            let mut row = row;

            let result = Item {
                id: row.take("id"),
                title: row.take("title").unwrap(),
                category_id: row.take("category_id").unwrap(),
                cost: row.take("cost").unwrap(),
                note: row.take("note").unwrap(),
                status: row.take("status").unwrap(),
                statdesc: row.take("statdesc").unwrap(),
                hidden: row.take("hidden").unwrap(),
            };

            Ok(result)
        }
    }
}

pub mod functions {
    use std::collections::HashMap;

    use serde_json;

    use crate::structs;

    pub fn parse_json_string(req: String) -> HashMap<u32, structs::Item> {
        let mut result: HashMap<u32, structs::Item> = HashMap::new();

        let items: Vec<structs::Item> = serde_json::from_str(&req).unwrap();
        for item in items {
            result.insert(item.id.unwrap(), item);
        }

        result
    }
}
