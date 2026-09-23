defmodule FlambeNext.Repo.Migrations.DropTodos do
  use Ecto.Migration

  def change do
    drop table(:todos)
  end
end
