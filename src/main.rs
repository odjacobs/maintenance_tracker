#![allow(unused)]

use std::collections::BTreeMap;
use std::env::var;
use std::io;

use dotenv::dotenv;
use mysql::{prelude::*, *};
use rpassword::read_password;
use tera::Tera;
use tide_tera::prelude::*;

mod core;
mod data;
mod db;

use crate::core::{functions, structs};
use data::*;
use db::database;

#[derive(Clone, Debug)]
struct State {
    /// Container for simple runtime data.
    app_title: Option<String>,
    app_version: Option<String>,
    conn_string: String,
    tera: Tera,
}

impl State {
    fn new(tera_instance: Tera, conn_string: String) -> Self {
        State {
            app_title: None,
            app_version: None,
            conn_string: conn_string,
            tera: tera_instance,
        }
    }
}

fn get_conn(conn_string: &String) -> Result<PooledConn> {
    /// Establish a database connection from environment variables.
    database::connect(conn_string.clone())
}

fn get_conn_string() -> String {
    /// Get user input for database information.
    println!("Username:");
    let mut username: String = String::new();
    io::stdin().read_line(&mut username);

    println!("Password:");
    let password = read_password().unwrap();

    println!("MySQL URL:");
    let mut url: String = String::new();
    io::stdin().read_line(&mut url);

    println!("Database Name:");
    let mut name: String = String::new();
    io::stdin().read_line(&mut name);

    format!(
        "mysql://{}:{}@{}/{}",
        username.trim(),
        password.trim(),
        url.trim(),
        name.trim(),
    )
}

#[async_std::main]
async fn main() -> Result<()> {
    dotenv().ok();

    tide::log::start();

    let mut conn_string: String = String::new();
    let mut conn: PooledConn;

    loop {
        conn_string = get_conn_string();
        conn = match get_conn(&conn_string) {
            Ok(conn) => conn,
            Err(_) => continue,
        };

        break;
    }

    // we're using tera for templating
    let mut tera = Tera::new("templates/**/*").expect("Error parsing templates directory.");
    tera.autoescape_on(vec!["html"]);

    let mut state = State::new(tera, conn_string.clone());
    let mut app = tide::with_state(state);

    // get existing database items
    let mut items = database::collect_items(&mut conn);

    app.at("/static").serve_dir("./static").unwrap();

    // index page
    app.at("/")
        .get(|req: tide::Request<State>| async move {
            /// Get information from the database.
            let tera = req.state().tera.clone();
            let conn_string = req.state().conn_string.clone();
            let mut c = get_conn(&conn_string).unwrap();

            tera.render_response(
                "index.html",
                &context! {
                    "app_title" => constants::APP_TITLE.to_owned(),
                    "app_version" => constants::APP_VERSION.to_owned(),
                    "categories" => database::collect_categories(&mut c),
                    "items" => database::collect_items(&mut c),
                },
            )
        })
        .post(|mut req: tide::Request<State>| async move {
            /// Update information in the database.
            let req_string = req.body_string().await?;
            let items = functions::parse_json_string(req_string);
            let conn_string = req.state().conn_string.clone();

            for (id, item) in items {
                database::update_item(&mut get_conn(&conn_string).unwrap(), &item)?;
            }

            Ok("OK")
        });

    // ajax history
    app.at("history/:id")
        .get(|mut req: tide::Request<State>| async move {
            // get item id from URL
            let id = req.param("id").unwrap();
            let conn_string = req.state().conn_string.clone();

            // get all entries with matching id
            let mut entries =
                database::collect_item_entries(&mut get_conn(&conn_string.clone()).unwrap(), &id);

            // build HTML response
            let mut html_str = String::from("");
            for entry in entries {
                html_str.push_str(&format!(
                    "
                    <div class=\"entry\">
                        <p>{}</p>
                        <p>{}</p>
                        <p>{}</p>
                        <p class=\"note\">{}</p>
                    </div>
                    ",
                    entry.date.unwrap(),
                    entry.status.unwrap_or(0),
                    entry.cost.unwrap_or(0),
                    entry.note.unwrap_or("No Description.".to_string())
                ));
            }

            Ok(html_str)
        });

    // run the application
    app.listen("127.0.0.1:8000").await?;

    Ok(())
}
