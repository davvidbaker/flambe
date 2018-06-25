defmodule Steady.Utilities do
  import Ecto.Changeset

  def convert_timestamp_integer_to_datetime(changeset) do
    timestamp_integer = get_field(changeset, :timestamp_integer)

    case is_integer(timestamp_integer) do
      true ->
        timestamp = Ecto.DateTime.from_unix!(timestamp_integer, 1000)
        put_change(changeset, :timestamp, timestamp)

      false ->
        add_error(changeset, :timestamp, "input not valid")
    end
  end
end
