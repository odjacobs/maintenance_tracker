# Maintenance Tracker

Maintenance Tracker is a more advanced to-do application that tracks the status of various items in a MySQL database. Values tracked include an item's category, title, status, estimated repair cost, maintainer's note, and past updates.

The database structure includes the following tables:

* Category
    - `id` (Primary Key)
    - `title`

* Item
    - `id` (Primary Key)
    - `title`
    - `category_id` (Foreign Key, references `Category`)

* Entry
    - `id` (Primary Key)
    - `item_id` (Foreign Key, references `Item`)
    - `cost`
    - `note`
    - `status`
    - `visible`
    - `date`