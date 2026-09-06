-- https://github.com/alex-popov-tech/change_case.nvim/blob/2b6004ba57d70e3df9be514708b8acaf9f7455d6/lua/change_case/case_transformers.lua#L13-L34
return {
  camel_case = {
    separator = "",
    word_transformer = function(word, index)
      if index ~= 1 then
        return capitalize(word:lower())
      end
      return word:lower()
    end,
  },
  upper_camel_case = {
    separator = "",
    word_transformer = function(word)
      return capitalize(word)
    end,
  },
  snake_case = {
    separator = "_",
    word_transformer = function(word)
      return word:lower()
    end,
  },
