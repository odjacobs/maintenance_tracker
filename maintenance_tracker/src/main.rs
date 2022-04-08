#[macro_use]
extern crate rocket;

use rocket::fs::{relative, FileServer};
use rocket_dyn_templates::Template;
use serde::Deserialize;

use std::cmp::{Ordering::Equal, PartialEq, PartialOrd};
use std::collections::HashMap;
use std::fs;

// structs
#[derive(serde::Serialize, Deserialize, Debug)]
struct Context {
    title: &'static str,
    version: &'static str,
    data: Data,
}

#[derive(serde::Serialize, Deserialize, Debug)]
struct Data {
    sections: Vec<Section>,
}

impl From<HashMap<String, Vec<Item>>> for Data {
    fn from(item: HashMap<String, Vec<Item>>) -> Self {
        let mut sections: Vec<Section> = Vec::new();

        for (k, v) in item {
            sections.push(Section { title: k, items: v })
        }

        sections.sort_by(|a, b| a.partial_cmp(b).unwrap_or(Equal));

        Data { sections: sections }
    }
}

#[derive(serde::Serialize, Deserialize, Debug, PartialEq, PartialOrd)]
struct Section {
    title: String,
    items: Vec<Item>,
}

#[derive(serde::Serialize, Deserialize, Debug, PartialEq, PartialOrd)]
struct Item {
    title: String,
    cost: f32,
    note: String,
    statdesc: String,
    status: u8,
}

// functions
fn data_from_json_string(data: String) -> Data {
    let data: HashMap<String, Vec<Item>> = serde_json::from_str(&data).unwrap();

    Data::from(data)
}

fn string_from_json() -> String {
    match fs::read_to_string("info.json") {
        Ok(data) => data,
        Err(e) => {
            println!("{}", e);
            panic!("Could not read from info.json")
        }
    }
}

// routes
#[get("/")]
fn index() -> Template {
    let data_string: String = string_from_json();
    let data: Data = data_from_json_string(data_string);

    let context = Context {
        title: "Maintenance Tracker",
        version: "0.1.0",
        data: data,
    };

    Template::render("base", &context)
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![index,])
        .mount("/static", FileServer::from(relative!("/static")))
        .attach(Template::fairing())
}
