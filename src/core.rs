#![allow(unused)]

pub mod structs {
    use std::collections::HashMap;

    use mysql::prelude::*;
    use mysql::{FromRowError, FromValueError, Row, Value};
    use serde::{Deserialize, Serialize};

    #[derive(serde::Serialize, Debug, PartialEq, Eq)]
    pub struct Category {
        /// Category for sorting items.
        pub id: u32,
        pub title: String,
    }

    impl FromRow for Category {
        fn from_row_opt(row: Row) -> Result<Category, FromRowError> {
            /// Convert a row of data into a Category.
            let mut row = row;

            let result = Category {
                id: row.take("id").unwrap(),
                title: row.take("title").unwrap(),
            };

            Ok(result)
        }
    }

    #[derive(Serialize, Deserialize, Clone)]
    pub struct IItem {
        /// Intermediate Item interface
        pub id: Option<u32>,
        pub title: String,
        pub category_id: u32,
        pub cost: u32,
        pub note: Option<String>,
        pub statdesc: Option<String>,
        pub status: u8,
        pub visible: bool,
    }

    #[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
    pub struct Item {
        /// An item in the database.
        pub id: Option<u32>,
        pub title: String,
        pub category_id: u32,
        pub details: Option<ItemDetails>,
    }

    impl Item {
        pub fn new(title: String, category_id: u32, details: Option<ItemDetails>) -> Item {
            Item {
                id: None,
                title,
                category_id,
                details,
            }
        }
    }

    impl FromRow for Item {
        fn from_row_opt(row: Row) -> Result<Item, FromRowError> {
            /// Convert a row of data into an Item.
            let mut row = row;
            let result = Item {
                id: row.take("id"),
                title: row.take("title").unwrap(),
                category_id: row.take("category_id").unwrap(),
                details: None,
            };

            Ok(result)
        }
    }

    #[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq)]
    pub struct ItemDetails {
        pub cost: Option<u32>,
        pub note: Option<String>,
        pub statdesc: Option<String>,
        pub status: u8,
        pub visible: bool,
    }

    impl FromRow for ItemDetails {
        fn from_row_opt(row: Row) -> Result<ItemDetails, FromRowError> {
            /// Convert a row of data into an Item.
            let mut row = row;

            let result = ItemDetails {
                cost: row.take("cost").unwrap(),
                note: row.take("note").unwrap(),
                statdesc: row.take("statdesc").unwrap(),
                status: row.take("status").unwrap(),
                visible: row.take("visible").unwrap(),
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
        /// Takes JSON data from a POST request and converts it
        /// into a collection of items to update in the database.
        let mut result: HashMap<u32, structs::Item> = HashMap::new();

        let mut iitems: Vec<structs::IItem> = serde_json::from_str(&req).unwrap();
        for iitem in iitems.iter_mut() {
            let details = structs::ItemDetails {
                cost: Some(iitem.cost),
                note: iitem.note.clone(),
                statdesc: iitem.statdesc.clone(),
                status: iitem.status,
                visible: iitem.visible,
            };

            result.insert(
                iitem.id.unwrap(),
                structs::Item {
                    id: iitem.id,
                    title: iitem.title.clone(),
                    category_id: iitem.category_id,
                    details: Some(details),
                },
            );
        }

        println!("{:#?}", result);

        result
    }
}
