defmodule Stitch.Repo.Migrations.CreateTodos do
  use Ecto.Migration

  def change do
    create table(:todos) do
      add :name, :string
      add :description, :string
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps()
    end

  end
end
