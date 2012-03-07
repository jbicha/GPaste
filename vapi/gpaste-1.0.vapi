/* gpaste-1.0.vapi generated by vapigen-0.14, do not modify. */

[CCode (cprefix = "GPaste", gir_namespace = "GPaste", gir_version = "1.0", lower_case_cprefix = "g_paste_")]
namespace GPaste {
	[CCode (cheader_filename = "gpaste.h", type_id = "g_paste_clipboard_get_type ()")]
	public class Clipboard : GLib.Object {
		[CCode (has_construct_function = false)]
		public Clipboard (Gdk.Atom target, GPaste.Settings settings);
		public unowned string get_image_checksum ();
		public unowned Gtk.Clipboard get_real ();
		public Gdk.Atom get_target ();
		public unowned string get_text ();
		public void select_item (GPaste.Item item);
		public void select_text (string text);
		public Gdk.Pixbuf set_image ();
		public unowned string set_text ();
	}
	[CCode (cheader_filename = "gpaste.h", type_id = "g_paste_clipboards_manager_get_type ()")]
	public class ClipboardsManager : GLib.Object {
		[CCode (has_construct_function = false)]
		public ClipboardsManager (GPaste.History history, GPaste.Settings settings);
		public void activate ();
		public void add_clipboard (GPaste.Clipboard clipboard);
		public void select (GPaste.Item item);
	}
	[CCode (cheader_filename = "gpaste.h", type_id = "g_paste_history_get_type ()")]
	public class History : GLib.Object {
		[CCode (has_construct_function = false)]
		public History (GPaste.Settings settings);
		public void add (GPaste.Item item);
		public void empty ();
		public unowned string get_element_value (uint index);
		public unowned GLib.SList<GPaste.Item> get_history ();
		public void load ();
		public void remove (uint index);
		public void save ();
		public void select (uint index);
		public signal void changed ();
		public signal void selected (GPaste.Item object);
	}
	[CCode (cheader_filename = "gpaste.h", type_id = "g_paste_image_item_get_type ()")]
	public class ImageItem : GPaste.Item {
		[CCode (has_construct_function = false)]
		public ImageItem (Gdk.Pixbuf img);
		[CCode (has_construct_function = false)]
		public ImageItem.from_file (string path, GLib.DateTime date);
		public unowned string get_checksum ();
		public unowned GLib.DateTime get_date ();
		public unowned Gdk.Pixbuf get_image ();
	}
	[CCode (cheader_filename = "gpaste.h", type_id = "g_paste_item_get_type ()")]
	public abstract class Item : GLib.Object {
		[CCode (has_construct_function = false)]
		protected Item ();
		public virtual bool equals (GPaste.Item other);
		public unowned string get_display_string ();
		public virtual unowned string get_kind ();
		public unowned string get_value ();
		[NoWrapper]
		public virtual bool has_value ();
	}
	[CCode (cheader_filename = "gpaste.h", type_id = "g_paste_keybinder_get_type ()")]
	public class Keybinder : GLib.Object {
		[CCode (has_construct_function = false)]
		public Keybinder (string binding);
		public void rebind (string binding);
		public void unbind ();
		public signal void toggle ();
	}
	[CCode (cheader_filename = "gpaste.h", type_id = "g_paste_settings_get_type ()")]
	public class Settings : GLib.Object {
		[CCode (has_construct_function = false)]
		public Settings ();
		public uint get_element_size ();
		public unowned string get_keyboard_shortcut ();
		public uint get_max_displayed_history_size ();
		public uint get_max_history_size ();
		public uint get_max_text_item_size ();
		public uint get_min_text_item_size ();
		public bool get_primary_to_history ();
		public bool get_save_history ();
		public bool get_synchronize_clipboards ();
		public bool get_track_changes ();
		public bool get_track_extension_state ();
		public bool get_trim_items ();
		public void set_element_size (uint value);
		public void set_keyboard_shortcut (string value);
		public void set_max_displayed_history_size (uint value);
		public void set_max_history_size (uint value);
		public void set_max_text_item_size (uint value);
		public void set_min_text_item_size (uint value);
		public void set_primary_to_history (bool value);
		public void set_save_history (bool value);
		public void set_synchronize_clipboards (bool value);
		public void set_track_changes (bool value);
		public void set_track_extension_state (bool value);
		public void set_trim_items (bool value);
		public signal void changed (string object);
		public signal void rebind (string object);
		public signal void track (bool object);
	}
	[CCode (cheader_filename = "gpaste.h", type_id = "g_paste_text_item_get_type ()")]
	public class TextItem : GPaste.Item {
		[CCode (has_construct_function = false)]
		public TextItem (string text);
	}
	[CCode (cheader_filename = "gpaste.h", type_id = "g_paste_uris_item_get_type ()")]
	public class UrisItem : GPaste.TextItem {
		[CCode (has_construct_function = false)]
		public UrisItem (string uris);
		[CCode (array_length = false, array_null_terminated = true)]
		public unowned string[] get_uris ();
	}
}
