import json
def handler(event, context):
    try:
        number = int(event['number'])
    except Exception as e:
        raise Exception (json.dumps({"error": {"msg": "Not a number", "statusCode": 400}}))
    
    
    if(number%5==0 and number%3==0):
        output = 'fizzbuzz'
    elif(number%3==0):
        output = 'fizz'
    elif(number%5==0):
        output = 'buzz'
    else:
        output = 'the number cannot be divided by 5 or 3'

    return {
        'result': output
    }