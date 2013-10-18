/*
 *      This file is part of GPaste.
 *
 *      Copyright 2013 Marc-Antoine Perennou <Marc-Antoine@Perennou.com>
 *
 *      GPaste is free software: you can redistribute it and/or modify
 *      it under the terms of the GNU General Public License as published by
 *      the Free Software Foundation, either version 3 of the License, or
 *      (at your option) any later version.
 *
 *      GPaste is distributed in the hope that it will be useful,
 *      but WITHOUT ANY WARRANTY; without even the implied warranty of
 *      MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *      GNU General Public License for more details.
 *
 *      You should have received a copy of the GNU General Public License
 *      along with GPaste.  If not, see <http://www.gnu.org/licenses/>.
 */

#include <gpaste-gnome-shell-client.h>

#include <stdio.h>
#include <stdlib.h>

#define EXIT_TEST_SKIP 77

gint
main (gint argc, gchar *argv[])
{
    if (argc != 2 || g_strcmp0 (argv[1], "--dont-skip"))
        return EXIT_TEST_SKIP;

    g_setenv ("G_MESSAGES_DEBUG", "all", TRUE);

    GError *error = NULL;
    G_PASTE_CLEANUP_UNREF GPasteGnomeShellClient *client = g_paste_gnome_shell_client_new (&error);
    if (!client)
    {
        g_error ("Couldn't connect to gnome-shell: %s", error->message);
        g_error_free (error);
        return EXIT_FAILURE;
    } 

    g_print ("gnome-shell mode: %s\n", g_paste_gnome_shell_client_get_mode (client));
    g_print ("gnome-shell version: %s\n", g_paste_gnome_shell_client_get_shell_version (client));
    
    g_print ("Will now play with overview's state, don't worry.\n");
    g_usleep (1000000);
    gboolean expected = FALSE;
    for (guint i = 0; i < 3; ++i)
    {
        gboolean active = g_paste_gnome_shell_client_overview_is_active (client);
        g_print ("Overview is %sactive (should be %sactive)\n", active ? "" : "in", expected ? "" : "in");
        if (i != 2)
        {
            expected = !expected;
            if (!g_paste_gnome_shell_client_overview_set_active (client, expected, &error))
            {
                g_error ("Couldn't set gnome-shell overview state: %s", error->message);
                g_error_free (error);
                return EXIT_FAILURE;
            }
            g_usleep (1000000);
        }
    }

    gchar *result = NULL;

    if (!g_paste_gnome_shell_client_eval (client, "3 + 2", &result, &error))
    {
        g_error ("Failed to eval \"3 + 2\": %s", error->message);
        g_error_free (error);
        return EXIT_FAILURE;
    }
    g_print ("Evaluated \"3 + 2\" as \"%s\"\n", result);

    if (g_paste_gnome_shell_client_eval (client, "foobar", &result, &error))
    {
        g_error ("Did not fail to eval \"fobar\"");
        return EXIT_FAILURE;
    }
    if (error)
    {
        g_error ("Error when trying to evaluate \"foobar\": %s", error->message);
        g_error_free (error);
        return EXIT_FAILURE;
    }
    g_print ("As expected, couldn't eval \"foobar\"\n");
    g_clear_error (&error);

    g_print ("Should now focus search\n");
    g_usleep (1000000);
    g_paste_gnome_shell_client_focus_search (client, &error);
    if (error)
    {
        g_error ("Couldn't focus search: %s", error->message);
        g_error_free (error);
        return EXIT_FAILURE;
    }
    g_usleep (1500000);

    if (!g_paste_gnome_shell_client_overview_set_active (client, expected, &error))
    {
        g_error ("Couldn't set gnome-shell overview state: %s", error->message);
        g_error_free (error);
        return EXIT_FAILURE;
    }

    g_print ("Now testing OSD\n");
    g_usleep (1000000);
    g_paste_gnome_shell_client_show_osd (client, "gtk-paste", "Test GPaste OSD", 80, &error);
    if (error)
    {
        g_error ("Couldn't show OSD: %s", error->message);
        g_error_free (error);
        return EXIT_FAILURE;
    }

    g_print ("Should now focus firefox\n");
    g_usleep (3000000);
    g_paste_gnome_shell_client_focus_app (client, "firefox.desktop", &error);
    if (error)
    {
        g_error ("Couldn't focus firefox: %s", error->message);
        g_error_free (error);
        return EXIT_FAILURE;
    }
    g_usleep (3000000);

    if (!g_paste_gnome_shell_client_overview_set_active (client, expected, &error))
    {
        g_error ("Couldn't set gnome-shell overview state: %s", error->message);
        g_error_free (error);
        return EXIT_FAILURE;
    }

    g_print ("Should now show applications\n");
    g_usleep (1000000);
    g_paste_gnome_shell_client_show_applications (client, &error);
    if (error)
    {
        g_error ("Couldn't show applications: %s", error->message);
        g_error_free (error);
        return EXIT_FAILURE;
    }
    g_usleep (3000000);

    if (!g_paste_gnome_shell_client_overview_set_active (client, expected, &error))
    {
        g_error ("Couldn't set gnome-shell overview state: %s", error->message);
        g_error_free (error);
        return EXIT_FAILURE;
    }

    // TODO: grab accelerator
    // TODO: grab accelerators
    // TODO: ungrab accelerator
    // TODO: signal accelerator-activated

    return EXIT_SUCCESS;
}
