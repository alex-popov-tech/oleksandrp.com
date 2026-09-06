# https://github.com/alex-popov-tech/.dotfiles/blob/729394ec7a9c2a08f50e052eb0173c129d4d0252/zsh/.zsh/aliases#L17-L30
alias gist="pbpaste | gh gist create | rg github | pbcopy"
alias lg="lazygit"
alias ld="lazydocker"

alias gf='nvim $(fzf)'

alias q="exit"

alias app='fd ".app" /System/Library/CoreServices /System/Applications /Applications /System/Applications/Utilities --max-depth 1 | fzf | xargs -I {} open "{}"'

alias ls='lsd --group-dirs first --classify'
alias la='lsd --group-dirs first --classify --almost-all'
alias ll='lsd --group-dirs first --classify --almost-all --long'
alias lt='lsd --tree'
