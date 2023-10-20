export const successCard=
{
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.5",
    "refresh": {
        "userIds": [],
        "action": {
            "type": "Action.Execute",
            "verb": "refresh",
            "title": "Refresh",
            "data": {
                "pdtId": "${productId}",
                "pdtName": "${productName}",
                "categoryId": "${categoryId}"
            }
        }
    },
    "body": [
        {
          "type": "TextBlock",
          "text": "Stock for ${productName} updated successfully!",
          "weight": "Bolder",
      "size": "Medium",
      "color": "Good" 
        },
        {
          "type": "TextBlock",
          "text": "New stock quantity is ${unitsInStock}.",
          "weight": "Bolder"
        }
      ]
}