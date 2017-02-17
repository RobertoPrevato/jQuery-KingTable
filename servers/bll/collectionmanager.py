"""
 * jQuery-KingTable demo 1.0.1
 * https://github.com/RobertoPrevato/jQuery-KingTable
 *
 * Copyright 2017, Roberto Prevato
 * https://robertoprevato.github.io
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 *
 * This file contains the business logic to work with example collections.
 *
"""
import os
import json
from core.lists.listutils import ListUtils
from core.literature.scribe import Scribe

# The maximum collection length that the server allows for "fixed collections"
# (i.e. collections that don't require server side pagination)
MAXIMUM_COLLECTION_LENGTH = 600


class CollectionManager:
    """Provides methods to work with underlying collections; read from static json structures"""
    def __init__(self, file_path):
        self.file_path = file_path
        self._collection = None

    def get_catalog(self, data):
        if data is None:
            raise TypeError
        fixed = data["fixed"]
        if fixed:
            # the client is asking a full collection (i.e. a collection that doesn't require server side pagination)
            # return the collection; but only if it doesn't exceeds a reasonable maximum
            all_data = self.get_all()
            all_data = ListUtils.optimize_list(all_data)
            if len(all_data) <= MAXIMUM_COLLECTION_LENGTH:
                return all_data

        # timestamp = data["timestamp"] # timestamp of the first time a page was required
        page_number = data["page"]
        page_size = data["size"]
        search = data["search"] if "search" in data else ""
        order_by = data["orderBy"]
        sort_order = data["sortOrder"]
        # get the collection
        collection, total_rows = self.get_catalog_page(page_number, page_size, search, order_by, sort_order)
        # optimize the collection
        collection = ListUtils.optimize_list(collection)
        result = {"subset": collection, "page": page_number, "total": total_rows}
        return result

    def get_data_path(self):
        root_dir = os.path.dirname(os.getcwd())
        rel = os.path.join(root_dir, "servers", "data", self.file_path)
        return os.path.abspath(rel)

    def get_catalog_page(self, page_number, page_size, search, order_by, sort_order):
        """Gets a catalog page of the managed collection."""
        collection = self.get_all()
        if search is not None and search != "":
            """
            # NB: if a search filter is provided by the client; then the server side should:
            # 1. search inside the properties we know should be searched into, and skim the results.
            # 2. set the total items count as the total of items that respond to the search.
            # 3. return the full set of items that respect the search criteria.
            #
            # As a side note, keep in mind that some properties, like dates and decimal, should be evaluated for their
            # culture-dependent string representations of values; not their intrinsic values.
            # Example: a date in UK English can be dd/mm/yyyy; in US English can be mm/dd/yyyy.
            # A well designed search implementation adapts to the current user's culture.
            """
            collection = ListUtils.search(collection, search, "*")

        # NB: if an order by is defined; we need to order before paginating results!
        if order_by is not None and order_by != "":
            collection = ListUtils.sort_by(collection, order_by, sort_order)

        # return a paginated result to the client:
        skip = ((page_number-1)*page_size) if page_number > 0 else 0

        # the client needs to know the total items count, in order to build the pagination
        total_items_count = len(collection)

        result = ListUtils.sampling(collection, skip, page_size)
        # return the collection and the count of results:
        return result, total_items_count

    def get_all(self):
        """Gets the complete list of colors."""
        if self._collection is None:
            file_path = self.get_data_path()

            # read the colors.json file (this simulates the data access, without data access layer)
            file_data = Scribe.read(file_path)
            self._collection = json.loads(file_data)

        return self._collection
