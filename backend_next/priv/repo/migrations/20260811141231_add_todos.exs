defmodule FlambeNext.Repo.Migrations.AddTodos do
  use Ecto.Migration

  def change do
    create table(:todos) do
      add :name, :string, null: false
      add :description, :string
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:todos, [:user_id])
  end
end
