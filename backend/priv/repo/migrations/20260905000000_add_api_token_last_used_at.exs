defmodule FlambeNext.Repo.Migrations.AddApiTokenLastUsedAt do
  use Ecto.Migration

  def change do
    alter table(:api_tokens) do
      add :last_used_at, :utc_datetime
    end
  end
end
