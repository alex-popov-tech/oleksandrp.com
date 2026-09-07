-- https://github.com/alex-popov-tech/change_case.nvim/blob/2b6004ba57d70e3df9be514708b8acaf9f7455d6/lua/change_case/util.lua#L28-L52
--- @param text string
--- @return string[]
local function split_into_words(text)
  local sub_words = {}
  local word_pointer = 1

  local index = 1
  while index <= #text do
    -- Extract the i-th character
    local curr_char = string.sub(text, index, index)
    local peek_char = string.sub(text, index + 1, index + 1)

    if isLetter(curr_char) then
      sub_words[word_pointer] = (sub_words[word_pointer] or "") .. curr_char

      if isNewWordFromPeek(curr_char, peek_char) then
        word_pointer = word_pointer + 1
      end
    end

    index = index + 1
  end

  return sub_words
end
