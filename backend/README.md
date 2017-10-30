# Stitch

To start your Phoenix server:

  * Install dependencies with `mix deps.get`
  * Create and migrate your database with `mix ecto.create && mix ecto.migrate`
  * Install Node.js dependencies with `cd assets && npm install`
  * Start Phoenix endpoint with `mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](http://www.phoenixframework.org/docs/deployment).

## Learn more

  * Official website: http://www.phoenixframework.org/
  * Guides: http://phoenixframework.org/docs/overview
  * Docs: https://hexdocs.pm/phoenix
  * Mailing list: http://groups.google.com/group/phoenix-talk
  * Source: https://github.com/phoenixframework/phoenix

## Need to do a bunch of things to make it multi-user friendly
  * unique constraints shuold be per user, not global
    - I am only doing this a little bit right now. I think I am doing it properly for user categories.


## Writeup

I'm probably doing some things kinda wrong.

* ⚠️ TESTING is probably done rather haphazardly. I couldn't find a good resource on how to organize things for Phoenix 1.3.

* 🤔 Should I be passing around ids or structs/maps.

