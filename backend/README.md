# Steady

To start your Phoenix server:

* Install dependencies with `mix deps.get`
* Create and migrate your database with `mix ecto.create && mix ecto.migrate`
* Install Node.js dependencies with `cd assets && npm install`
* Start Phoenix endpoint with `mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

## Architecture Decisions

### Reason for having a backend at all, instead of just using something like firebase

Right now, main reason I am thinking of is to easily listen for external
webhooks, like from Trello, Github, etc. This could, however, just be done with
event listening lamda functions...

## Need to do a bunch of things to make it multi-user friendly

* Right now to make a user go localhost:4000/auth/github

- unique constraints shuold be per user, not global
  * I am only doing this a little bit right now. I think I am doing it properly
    for user categories.

## Writeup

I'm probably doing some things kinda wrong.

* ⚠️ TESTING is probably done rather haphazardly. I couldn't find a good
  resource on how to organize things for Phoenix 1.3.

* 🤔 Should I be passing around ids or structs/maps.
