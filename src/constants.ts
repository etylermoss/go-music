/** Preamble text to be placed at the start of the
 *  configuration file to give information on it.
 */
const configPreamble =
`\
# Go Music: Configuration file.

# This file is written in the TOML format.
# Available options: <GITHUB/WIKI>.
# See: https://wikipedia.org/wiki/TOML.
\n`;

/** Extensions seen by the server, used when
 *  searching for music files / album art, entries
 *  must be lowercase with no . at the start
 */
const extensionWhitelist =
[
	'mp3', 'opus', 'ogg', 'wav',
	'flac', 'm4a', 'aac', 'png',
	'jpg', 'jpeg', 'bmp', 'gif'
];

/** Help information used when the user runs the
 *  application with -h or --help. 
 */
const getHelpInfo = (port: number): string => {
	return `\
Go Music: Personal music server.

  -c, --config: The directory of the configuration
    files. It will be created if it does not exist,
	and contain go-music.config.toml.
	Defaults to ~/.config/go-music/
  -p, --port: The port to run the server on.
    Defaults to ${port}
  -h, --help: Print this help message.`;
};

export default { configPreamble, extensionWhitelist, getHelpInfo };