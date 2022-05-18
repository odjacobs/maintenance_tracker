#![allow(unused)]

pub mod structs {
    use std::collections::HashMap;
    use std::io;

    use mysql::prelude::*;
    use mysql::{FromRowError, FromValueError, Row, Value};
    use rpassword::read_password;
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

    #[derive(Clone, Debug, Serialize, Deserialize)]
    pub struct Config {
        pub port: u32,
    }

    impl Config {
        pub fn from_prompt() -> Self {
            let mut port_int: u32 = 80;

            loop {
                println!("Port (Default=80):");
                let mut port_string = String::new();
                io::stdin().read_line(&mut port_string);

                if port_string.trim() == "" {
                    break;
                }

                match port_string.trim().parse::<u32>() {
                    Ok(port) => {
                        port_int = port;
                        break;
                    }
                    Err(e) => {
                        println!("{}", e);
                        continue;
                    }
                }
            }

            Config { port: port_int }
        }
    }

    #[derive(Clone, Debug, Serialize, Deserialize)]
    pub struct DbCredentials {
        pub user: String,
        pub pass: String,
        pub db_url: String,
        pub db_name: String,
    }

    impl DbCredentials {
        pub fn from_prompt() -> Self {
            /// Get user input for database information.
            println!("Username:");
            let mut username = String::new();
            io::stdin().read_line(&mut username);

            println!("Password:");
            let password = read_password().unwrap();

            println!("MySQL URL:");
            let mut url = String::new();
            io::stdin().read_line(&mut url);

            println!("Database Name:");
            let mut name = String::new();
            io::stdin().read_line(&mut name);

            DbCredentials {
                user: username.trim().to_owned(),
                pass: password.trim().to_owned(),
                db_url: url.trim().to_owned(),
                db_name: name.trim().to_owned(),
            }
        }

        pub fn mysql_url(&self) -> String {
            format!(
                "mysql://{}:{}@{}/{}",
                self.user, self.pass, self.db_url, self.db_name,
            )
        }
    }

    pub struct Entry {
        pub id: Option<u32>,
        pub cost: Option<u32>,
        pub note: Option<String>,
        pub status: Option<u32>,
        pub visible: bool,
        pub date: Option<String>,
    }

    impl FromRow for Entry {
        fn from_row_opt(row: Row) -> Result<Entry, FromRowError> {
            /// Convert a row of data into an Entry.
            let mut row = row;

            let result = Entry {
                id: row.take("id").unwrap(),
                cost: row.take("cost").unwrap(),
                note: row.take("note").unwrap(),
                status: row.take("status").unwrap(),
                visible: row.take("visible").unwrap(),
                date: row.take("date").unwrap(),
            };

            Ok(result)
        }
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
        /// Mutable details about an Item.
        pub cost: Option<u32>,
        pub note: Option<String>,
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
        /// into a HashMap of items to update in the database.
        let mut result: HashMap<u32, structs::Item> = HashMap::new();
        let mut items: Vec<structs::Item> = serde_json::from_str(&req).unwrap();

        for item in items.iter() {
            result.insert(item.id.unwrap(), item.clone());
        }

        result
    }
}
