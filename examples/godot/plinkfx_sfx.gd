## plinkfx sound player for Godot 4. Add as an autoload named "Sfx", then: Sfx.play("coin")
##
## Export the sounds first (from your project folder):
##   npx plinkfx export sfx --variants
## That writes res://sfx/<category>/<name>-1.wav ... -4.wav (four takes per sound).
## In the import dock, leave "Normalize" off: plinkfx levels are already matched.
extends Node

const ROOT := "res://sfx"
const VOICES := 12

var _takes := {}          # name -> Array[AudioStream]
var _last := {}           # name -> index of the last take played
var _players: Array[AudioStreamPlayer] = []
var _next := 0


func _ready() -> void:
	for i in VOICES:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_players.append(p)
	_scan(ROOT)


func _scan(dir_path: String) -> void:
	var dir := DirAccess.open(dir_path)
	if dir == null:
		push_warning("plinkfx: %s not found. Run: npx plinkfx export sfx --variants" % dir_path)
		return
	for sub in dir.get_directories():
		_scan(dir_path.path_join(sub))
	# In the editor both coin-1.wav and coin-1.wav.import are listed; in exported builds only the
	# .import file is. Strip the suffix and load each file once.
	var seen := {}
	for file in dir.get_files():
		file = file.trim_suffix(".import")
		if not file.ends_with(".wav") or seen.has(file):
			continue
		seen[file] = true
		var base := file.get_basename()               # coin-1
		var key := base.substr(0, base.rfind("-")) if base.rfind("-") > 0 and base.right(1).is_valid_int() else base
		var stream: AudioStream = load(dir_path.path_join(file))
		if stream:
			_takes.get_or_add(key, []).append(stream)


## Play a sound by name. A different take each time, never the same twice in a row.
func play(sound: String, volume_db := 0.0, pitch := 1.0) -> void:
	var takes: Array = _takes.get(sound, [])
	if takes.is_empty():
		push_warning("plinkfx: no sound called '%s'" % sound)
		return
	var i := randi() % takes.size()
	if takes.size() > 1 and i == _last.get(sound, -1):
		i = (i + 1) % takes.size()
	_last[sound] = i
	var p := _players[_next]
	_next = (_next + 1) % VOICES
	p.stream = takes[i]
	p.volume_db = volume_db
	p.pitch_scale = pitch
	p.play()
