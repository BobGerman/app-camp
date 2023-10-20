export const editCard={
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
            "type": "Container",
            "items": [
                {
                    "type": "ColumnSet",
                    "columns": [
                        {
                            "type": "Column",
                            "width": "stretch",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "text": "${productName}",
                                    "weight": "Bolder",
                                    "size": "Medium",
                                    "wrap": true
                                },
                                {
                                    "type": "ColumnSet",
                                    "columns": [
                                        {
                                            "type": "Column",
                                            "width": "stretch",
                                            "items": [
                                                {
                                                    "type": "TextBlock",
                                                    "text": "$19.99",
                                                    "weight": "Bolder",
                                                    "size": "Large"
                                                }
                                            ]
                                        },
                                        {
                                            "type": "Column",
                                            "width": "stretch",
                                            "items": [
                                                {
                                                    "type": "TextBlock",
                                                    "text": "${unitsInStock} units",
                                                    "color": "Good"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "type": "ActionSet",
                                    "actions": [
                                         {
            "type": "Action.ShowCard",
            "title": "More Info",
            "card": {
                "type": "AdaptiveCard",
                "body": [
                    {
                        "type": "TextBlock",
                        "text": "Product Category",
                        "weight": "Bolder"
                    },
                    {
                        "type": "TextBlock",
                        "text": "Electronics"
                    },
                    {
                        "type": "TextBlock",
                        "text": "Supplier Name",
                        "weight": "Bolder"
                    },
                    {
                        "type": "TextBlock",
                        "text": "Supplier, Inc."
                    },
                    {
                        "type": "TextBlock",
                        "text": "Supplier City",
                        "weight": "Bolder"
                    },
                    {
                        "type": "TextBlock",
                        "text": "New York"
                    },
                    {
                        "type": "TextBlock",
                        "text": "Quantity per Unit",
                        "weight": "Bolder"
                    },
                    {
                        "type": "TextBlock",
                        "text": "10 units"
                    }
                ]
            }
        }
                                    ]
                                }
                            ]
                        },
                        {
                            "type": "Column",
                            "width": "stretch",
                            "items": [
                                {
                                    "type": "Image",
                                    "url": "${imageUrl}",
                                    "size": "Stretch",
                                    "horizontalAlignment": "Right",
                                    "altText": "Product Image",
                                    "spacing": "None"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    "actions": [      
      {
        "type": "Action.ShowCard",
        "title": "Edit Stock",
        "card": {
          "type": "AdaptiveCard",
          "body": [
            {
                "type": "Input.Text",
                "id": "txtStock",
                "label": "New stock count",
                "min": 0,
                "max": 9999,
                "errorMessage": "Invalid input, use whole positive number",
                "style": "tel"
            }
          ],
          "actions": [
            {
                "type": "Action.Execute",
                "title": "Update stock",
                "verb": "ok",
                "data": {
                    "pdtId": "${productId}",
                    "pdtName": "${productName}",
                    "categoryId": "${categoryId}"
                },
                "style": "positive"
            }
          ]
        }
      }
      
    ]
  }
  