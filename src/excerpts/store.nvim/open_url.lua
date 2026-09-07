-- https://github.com/alex-popov-tech/store.nvim/blob/c52e4fff19f3c59589328ffd352d7502fa8b580d/lua/store/utils.lua#L34-L48
function M.open_url(url)
  if not url or type(url) ~= "string" then
    return "Invalid URL: must be a non-empty string"
  end

  -- Validate URL format for security
  if not url:match("^https?://[%w%-%.%_%~%:/%?%#%[%]%@%!%$%&%'%(%)%*%+%,%;%=]+$") then
    return "Invalid URL format: " .. url
  end

  if not vim.ui.open then
    return "vim.ui.open not available - please update to Neovim 0.10+"
  end
  vim.ui.open(url)
end
