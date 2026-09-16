defmodule FlambeNext.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  alias FlambeNext.Accounts.{
    Attention,
    Category,
    Credential,
    Mantra,
    Observation,
    SearchTerm,
    Tab,
    Todo
  }

  alias FlambeNext.Traces.Trace

  @user_setting_keys ~w(rightAlignTimelineText)

  schema "users" do
    field :name, :string
    field :username, :string
    field :settings, :map, default: %{}

    has_many :credentials, Credential, on_replace: :delete
    has_many :traces, Trace
    has_many :categories, Category
    has_many :todos, Todo
    has_many :mantras, Mantra
    has_many :attentions, Attention
    has_many :tabs, Tab
    has_many :search_terms, SearchTerm
    has_many :observations, Observation

    timestamps(type: :utc_datetime)
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :username])
    |> validate_required([:name, :username])
    |> unique_constraint(:username)
  end

  def registration_changeset(user, attrs) do
    user
    |> changeset(attrs)
    |> cast_assoc(:credentials, with: &Credential.changeset/2, required: true)
  end

  def settings_changeset(user, incoming) when is_map(incoming) do
    incoming = stringify_keys(incoming)

    Enum.reduce(@user_setting_keys, change(user), fn key, changeset ->
      if Map.has_key?(incoming, key) do
        put_setting(changeset, key, incoming[key])
      else
        changeset
      end
    end)
  end

  defp put_setting(changeset, key, value) when is_boolean(value) do
    settings = get_field(changeset, :settings) || %{}
    put_change(changeset, :settings, Map.put(settings, key, value))
  end

  defp put_setting(changeset, key, _value) do
    add_error(changeset, :settings, "#{key} must be a boolean")
  end

  defp stringify_keys(map) do
    Map.new(map, fn
      {key, value} when is_atom(key) -> {Atom.to_string(key), value}
      {key, value} -> {key, value}
    end)
  end
end
