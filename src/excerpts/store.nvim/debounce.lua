-- https://github.com/alex-popov-tech/store.nvim/blob/c52e4fff19f3c59589328ffd352d7502fa8b580d/lua/store/utils.lua#L541-L553
function M.debounce(func, delay)
  local timer = nil
  return function(...)
    local args = { ... }
    if timer then
      vim.fn.timer_stop(timer)
    end
    timer = vim.fn.timer_start(delay, function()
      func(unpack(args))
      timer = nil
    end)
  end
end
