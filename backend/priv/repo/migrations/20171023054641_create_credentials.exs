defmodule Stitch.Repo.Migrations.CreateCredentials do
  use Ecto.Migration

  def change do
    create table(:credentials) do
      add :email, :string
      add :uid, :integer
      add :avatar, :string
      add :name, :string
      add :provider, :string
      
      add :user_id, references(:users, on_delete: :delete_all),
                    null: false
      
      timestamps()
    end

    create unique_index(:credentials, [:uid, :provider], name: :credentials_uid_provider_index)
    create index(:credentials, [:user_id])
  end
end
