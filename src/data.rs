#![allow(unused)]

pub mod constants {
    pub const APP_TITLE: &str = "Maintenance Tracker";
    pub const APP_VERSION: &str = "0.1.0";
    pub const CONFIG_FILE: &str = "config.json";
    pub const CREDENTIALS_FILE: &str = "credentials.json";
    pub const CREDENTIALS_INVALID_MSG: &str = "ERROR: Invalid login credentials, please try again.";
    pub const SAVED_CREDENTIALS_INVALID_MSG: &str = "ERROR: Saved login credentials are invalid, please run with the -s flag and enter the correct information.";
    pub const TABLE_NAME_CATEGORY: &str = "category";
    pub const TABLE_NAME_ENTRY: &str = "entry";
    pub const TABLE_NAME_ITEM: &str = "item";
    pub const REFERENCE_ID_CATEGORY: Option<&'static str> = None;
    pub const REFERENCE_ID_ENTRY: Option<&'static str> = Some("item_id");
    pub const REFERENCE_ID_ITEM: Option<&'static str> = Some("category_id");
}
