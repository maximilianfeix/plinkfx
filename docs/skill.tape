# Terminal recording of the commands the plinkfx skill runs (vhs docs/skill.tape).
Output docs/media/skill.gif
Set Shell "bash"
Set FontSize 17
Set Width 1100
Set Height 640
Set Padding 24
Set Theme { "background": "#16130F", "foreground": "#F2EDE3", "cursor": "#FF5A26", "black": "#16130F", "red": "#FF5A26", "green": "#4F9D69", "yellow": "#F2C14E", "blue": "#5B7A99", "magenta": "#B23A7B", "cyan": "#2F8F8A", "white": "#F2EDE3", "brightBlack": "#6B6358", "brightRed": "#FF7A4F", "brightGreen": "#6FBF89", "brightYellow": "#FFE08A", "brightBlue": "#7B9AB9", "brightMagenta": "#D25A9B", "brightCyan": "#4FAFAA", "brightWhite": "#FFFFFF" }
Set TypingSpeed 28ms
Hide
Type "cd .work/vhs && alias plinkfx='node ../../dist/cli.js' && export PS1='$ ' && clear" Enter
Show
Type "# ask: 'a heavy door for a dungeon'. 1) nearest sound in the catalogue" Enter
Type "plinkfx list mechanic | head -3" Enter
Sleep 1.2s
Type "# 2) write sounds/dungeon-door.json (creak + slam + stone room), set its level" Enter
Type "plinkfx level sounds/dungeon-door.json --like door-heavy" Enter
Sleep 2s
Type "# 3) measure against the reference" Enter
Type "plinkfx measure sounds/dungeon-door.json --like door-heavy" Enter
Sleep 3s
Type "plinkfx render sounds/dungeon-door.json -o dungeon-door.wav" Enter
Sleep 3s
