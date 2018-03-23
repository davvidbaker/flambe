defmodule Stitch.Repo.Migrations.AddNoteToSelfToUser do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :note_to_self, :string
    end
  end
end
