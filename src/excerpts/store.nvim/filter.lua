-- https://github.com/alex-popov-tech/store.nvim/blob/c52e4fff19f3c59589328ffd352d7502fa8b580d/lua/store/ui/filter/init.lua#L118-L132
function Filter:apply_filter()
  vim.cmd("stopinsert")
  local query = self:_get_current_query()
  local on_value = self.config.on_value

  -- Call callback after cleanup
  if on_value then
    on_value(query)
  end

  self.config.on_exit()

  local close_error = self:close()
  return close_error
end
