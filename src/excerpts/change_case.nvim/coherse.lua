-- https://github.com/alex-popov-tech/change_case.nvim/blob/2b6004ba57d70e3df9be514708b8acaf9f7455d6/lua/change_case/module.lua#L6-L27
--- @param case Case
M.coherse_keyword = function(case)
  local keyword = vim.fn.expand("<cword>")
  local words = util.split_into_words(keyword)
  local updated_keyword = util.words_to_case(words, case)
  if keyword == updated_keyword then
    vim.notify("[change_case] No change required", vim.log.levels.INFO)
    return
  end

  local rename, rename_type = util.get_rename_fun()
  local ok, result = pcall(rename, updated_keyword)
  if not ok then
    vim.notify("[change_case] Failed to rename: " .. result, vim.log.levels.ERROR)
    return
  end

  vim.notify(
    string.format("[change_case] Converted '%s' to '%s' using '%s'", keyword, updated_keyword, rename_type),
    vim.log.levels.INFO
  )
end
