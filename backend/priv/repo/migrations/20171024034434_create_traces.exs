defmodule Stitch.Repo.Migrations.CreateTraces do
  use Ecto.Migration

  def change do
    create table(:traces) do
      add :name, :string
      add :user_id, references(:users, on_delete: :delete_all),
      null: false

      timestamps()
    end

    create unique_index(:traces, [:name])
    create index(:traces, [:user_id])
  end
end
