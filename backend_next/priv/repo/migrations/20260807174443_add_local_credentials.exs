defmodule FlambeNext.Repo.Migrations.AddLocalCredentials do
  use Ecto.Migration

  def change do
    create table(:credentials) do
      add :email, :string, null: false
      add :password_hash, :string, null: false
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:credentials, [:email])
    create index(:credentials, [:user_id])
  end
end
