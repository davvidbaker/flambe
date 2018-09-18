IO.puts "hello david"

alias Flambe.{Accounts, Traces}
alias Flambe.Accounts.{User}

david = Accounts.get_user_from_username("david")
seed_user = Accounts.get_user_from_username("seed_user")
