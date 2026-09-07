-- https://github.com/alex-popov-tech/.dotfiles/blob/729394ec7a9c2a08f50e052eb0173c129d4d0252/nvim/.config/nvim/lua/autocommands.lua#L1-L19
-- highlight yanked text
vim.api.nvim_create_autocmd("TextYankPost", {
  callback = function()
    vim.hl.on_yank({ higroup = "Visual", timeout = 80 })
  end,
})

-- restore cursor to last position when reopening a file
vim.api.nvim_create_autocmd("BufReadPost", {
  callback = function(ev)
    local mark = vim.api.nvim_buf_get_mark(ev.buf, '"')
    local lcount = vim.api.nvim_buf_line_count(ev.buf)
    if mark[1] > 0 and mark[1] <= lcount
      and not vim.tbl_contains({ "commit", "gitrebase" }, vim.bo[ev.buf].filetype)
    then
      pcall(vim.api.nvim_win_set_cursor, 0, mark)
    end
  end,
})
