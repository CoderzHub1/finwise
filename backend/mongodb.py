from pymongo import MongoClient
def getdatabase(d):
    client = MongoClient('mongodb://localhost:27017')
    return client[d]