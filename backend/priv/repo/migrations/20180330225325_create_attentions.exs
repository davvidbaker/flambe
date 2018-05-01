defmodule Flambe.Repo.Migrations.CreateAttentions do
  use Ecto.Migration

  def change do
    create table(:attentions) do
      add(:thread_id, references(:threads, on_delete: :nothing))
      add(:user_id, references(:users, on_delete: :delete_all))
      add(:timestamp, :utc_datetime)

      timestamps()
    end

    create(index(:attentions, [:thread_id]))
    create(index(:attentions, [:user_id]))
  end
end
