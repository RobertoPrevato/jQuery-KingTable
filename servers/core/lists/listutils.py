import re
import locale
locale.setlocale(locale.LC_ALL, "")


class ListUtils:

    @staticmethod
    def sampling(selection, offset=0, limit=None):
        return selection[offset:(limit + offset if limit is not None else None)]

    @staticmethod
    def optimize_list(collection):
        """
         Optimizes a collection of items; into a collection of arrays.
         The first array contains the property names; the others the items values.
        """
        if len(collection) == 0:
            return collection
        first = collection[0]
        data = []
        data.append([x for x in first.keys()])
        for o in collection:
            data.append([x for x in o.values()])
        return data


    @staticmethod
    def search(collection, search, properties):
        """Simple search method, that supports only exact text."""
        # escape characters that need to be escaped
        search = re.escape(search)
        rx = re.compile(search, re.IGNORECASE)
        result = []
        for item in collection:
            if properties == "*":
                for x in item:
                    # TODO: support better non-strings with their culture-dependent representations
                    if rx.search(item[x]):
                        result.append(item)
            else:
                for p in properties:
                    if rx.search(item[p]):
                        result.append(item)
                        break
        return result

    @staticmethod
    def sort_by(collection, field, order, case_sensitive=False):
        """
        Simple sort method, that doesn't support special characters.
        in order to make something better, for example, consider locale.strxfrm function in Python3
        """
        # assume that the collection has the same objects
        if len(collection) == 0:
            return collection
        first_obj = collection[0]
        obj_lower = getattr(first_obj[field], "lower", None)
        has_lower = callable(obj_lower)
        rev = order == "desc"
        if case_sensitive or not has_lower:
            return sorted(collection, key=lambda x: x[field], reverse=rev)
        return sorted(collection, key=lambda x: x[field].lower(), reverse=rev)