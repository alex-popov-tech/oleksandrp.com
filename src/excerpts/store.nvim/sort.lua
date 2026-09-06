-- https://github.com/alex-popov-tech/store.nvim/blob/c52e4fff19f3c59589328ffd352d7502fa8b580d/lua/store/sort.lua#L3-L27
M.sorts = {
  most_stars = {
    label = "Most Stars",
    key = "s",
    key_col = 5,
    fn = function(a, b, _)
      return (a.stars.curr or 0) > (b.stars.curr or 0)
    end,
  },
  rising_stars_monthly = {
    label = "Rising Stars (monthly)",
    key = "m",
    key_col = 14,
    fn = function(a, b, _)
      return (a.stars.monthly or 0) > (b.stars.monthly or 0)
    end,
  },
  rising_stars_weekly = {
    label = "Rising Stars (weekly)",
    key = "w",
    key_col = 14,
    fn = function(a, b, _)
      return (a.stars.weekly or 0) > (b.stars.weekly or 0)
    end,
  },
