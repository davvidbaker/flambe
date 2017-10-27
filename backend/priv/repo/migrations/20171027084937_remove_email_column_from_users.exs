defmodule Stitch.Repo.Migrations.RemoveEmailColumnFromUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      remove :email
    end
  end
end
