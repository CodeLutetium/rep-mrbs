# Migrations
Database migrations is managed using [Goose](https://github.com/pressly/goose). Database migrations ensure that the database schema is in a consistent state across environments. 

## Dev workflow
1. Create a new migration with [Goose](https://github.com/pressly/goose). 
2. Run the migration with `goose up`
3. Run the model generator `dg_ctl create model ./models`

## Creating a new migration:
To add a new migration, run:

```
goose -s create <description> sql
```

## Rolling back to a previous version
To roll back to a previous version of the database, run:
```
goose down
```

## Best practices
Avoid running SQL statements in the database directly. Rather, use the migration tool. This ensures that the database schema and configurations can be accurately replicated by other developers.

If there is a schema change after deployment, create a new migration instead of rolling back.

Example, if you want to delete the `TRANSACTIONS` table (which was added in the last migration) after deploying, avoid using `goose down`.

Instead, create a new migration to delete the table. 

```
goose -s create delete_transactions sql

goose up
```

This allows the table to be deleted safely, and for other maintainers to know the changes that were made to the schema.
