import os
import json
from flask import Flask, request
from bll.collectionmanager import CollectionManager
"""
 * jQuery-KingTable example server 1.0.0
 * https://github.com/RobertoPrevato/jQuery-KingTable
 *
 * Copyright 2017, Roberto Prevato
 * https://robertoprevato.github.io
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
"""

# set the project root directory as the static folder, you can set others.
root_dir = os.path.dirname(os.getcwd())
rel = os.path.join(root_dir, ".", "source")
pat = os.path.abspath(rel)
app = Flask(__name__, static_folder=pat)

# set debug to true
app.debug = True
PORT = 44777

colors_manager = CollectionManager("colors.json")
people_manager = CollectionManager("people.json")


@app.route('/')
def root():
    return app.send_static_file('index.html')


@app.route("/api/colors", methods=["OPTIONS", "GET", "POST"])
def colors():
    # get the input data from the client:
    data = request.get_json()
    if data is None:
        return "Missing filters data.", 400, {"Content-Type": "text/plain"}

    result = colors_manager.get_catalog(data)
    return json.dumps(result, indent=4)


@app.route("/api/people", methods=["OPTIONS", "GET", "POST"])
def people():
    # get the input data from the client:
    data = request.get_json()
    if data is None:
        return "Missing filters data.", 400, {"Content-Type": "text/plain"}

    result = people_manager.get_catalog(data)
    return json.dumps(result, indent=4)


@app.route('/<path:path>')
def static_proxy(path):
    return app.send_static_file(path)

if __name__ == "__main__":
    # send_static_file will guess the correct MIME type
    print("...serving static files from: {}".format(pat))
    app.run(port=PORT, threaded=True)
