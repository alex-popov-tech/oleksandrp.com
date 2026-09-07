-- https://github.com/alex-popov-tech/.dotfiles/blob/729394ec7a9c2a08f50e052eb0173c129d4d0252/nvim/.config/nvim/lua/keymaps.lua#L1-L24
-- helper: run a search motion and briefly highlight the match
local function blink_search(key)
  return function()
    vim.cmd("normal! " .. key .. "zz")
    vim.opt.hlsearch = true
    vim.defer_fn(function()
      vim.opt.hlsearch = false
    end, 200)
  end
end

-- buffer navigation
vim.keymap.set("n", "<up>", "<cmd>bn<cr>")
vim.keymap.set("n", "<down>", "<cmd>bp<cr>")

-- splits (with splitbelow/splitright cursor lands in new window automatically)
vim.keymap.set("n", "<leader>s", "<cmd>split<cr>")
vim.keymap.set("n", "<leader>v", "<cmd>vsplit<cr>")

-- write and exit current buffer
vim.keymap.set("n", "<C-q>", "ZZ")

-- if pressing 'a' on an empty line, use 'S' instead (respects indent)
vim.keymap.set("n", "a", "len(getline('.')) == 0 ? 'S' : 'a'", { expr = true })
