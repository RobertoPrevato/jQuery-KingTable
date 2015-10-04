import re


class Text:

    @staticmethod
    def condensate(txt):
        """
            Returns a condensed version of the given string, trimming, removing line breaks and multiple spaces
        """
        s = txt.strip()
        s = Text.remove_line_breaks(s)
        s = Text.remove_multiple_spaces(s)
        return s
        
    @staticmethod
    def remove_line_breaks(txt):
        return txt.replace('\n', ' ').replace('\r', '')
        
    @staticmethod
    def remove_multiple_spaces(txt):
        return re.sub("[\s]+", " ", txt)
