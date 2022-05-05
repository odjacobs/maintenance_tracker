#![allow(unused)]

#[macro_use]
extern crate dotenv_codegen;

use std::collections::BTreeMap;

use dotenv::dotenv;
use mysql::{prelude::*, *};
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
    tera: Tera,
}

impl State {
    fn new(tera_instance: Tera) -> Self {
        State {
            app_title: None,
            app_version: None,
            tera: tera_instance,
        }
    }
}

fn get_conn() -> PooledConn {
    /// Establish a database connection from environment variables.
    database::connect(format!(
        "mysql://{}:{}@{}/{}",
        dotenv!("USER"),
        dotenv!("PASS"),
        dotenv!("DB_URL"),
        dotenv!("DB_NAME"),
    ))
    .unwrap()
}

#[async_std::main]
async fn main() -> Result<()> {
    dotenv().ok();

    tide::log::start();

    let mut conn = get_conn();

    // we're using tera for templating
    let mut tera = Tera::new("templates/**/*").expect("Error parsing templates directory.");
    tera.autoescape_on(vec!["html"]);

    let mut state = State::new(tera);
    let mut app = tide::with_state(state);

    // get existing database items
    let mut items = database::collect_items(&mut conn);

    app.at("/static").serve_dir("./static").unwrap();

    // index page
    app.at("/")
        .get(|req: tide::Request<State>| async move {
            /// Get information from the database.
            let tera = req.state().tera.clone();

            tera.render_response(
                "index.html",
                &context! {
                    "app_title" => constants::APP_TITLE.to_owned(),
                    "app_version" => constants::APP_VERSION.to_owned(),
                    "items" => database::collect_items(&mut get_conn()),
                },
            )
        })
        // TODO: type checking & error handling
        .post(|mut req: tide::Request<State>| async move {
            /// Update information in the database.
            let req_string = req.body_string().await?;
            let items = functions::parse_json_string(req_string);

            for (id, item) in items {
                database::update_item(&mut get_conn(), &item)?;
            }

            Ok("OK")
        });

    // run the application
    app.listen(format!("127.0.0.1:{}", dotenv!("CLIENT_PORT")))
        .await?;

    Ok(())
}
