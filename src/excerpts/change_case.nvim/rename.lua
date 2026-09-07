-- https://github.com/alex-popov-tech/change_case.nvim/blob/2b6004ba57d70e3df9be514708b8acaf9f7455d6/lua/change_case/util.lua#L114-L127
  --- @return fun(), string
  get_rename_fun = function()
    local lsp_rename, lsp_type = get_lsp_rename()
    if lsp_rename ~= nil then
      return lsp_rename, lsp_type
    end

    local treesitter_rename, treesitter_type = get_treesitter_rename()
    if treesitter_rename ~= nil then
      return treesitter_rename, treesitter_type
    end

    return get_norm_rename()
  end,
