import {
  TeamsActivityHandler,
  TurnContext,
  MessagingExtensionQuery,
  MessagingExtensionResponse,
  InvokeResponse
} from "botbuilder";
import productSearchME from "./messageExtensions/productSearchME";
export class SearchApp extends TeamsActivityHandler {
  constructor() {
    super();
  }

  // Handle search message extension
  public async handleTeamsMessagingExtensionQuery(
    context: TurnContext,
    query: MessagingExtensionQuery
  ): Promise<MessagingExtensionResponse> {

    switch (query.commandId) {
      case productSearchME.COMMAND_ID: {
        return productSearchME.handleTeamsMessagingExtensionQuery(context, query);
      }
    }

  }

  // Handle adaptive card action
  public async onInvokeActivity(context: TurnContext): Promise<InvokeResponse> {
    let runEvents = true;
    try {
      switch (context.activity.name) {
        case 'adaptiveCard/action':
          if(context.activity.value.action.verb === 'ok') {
          return productSearchME.handleTeamsCardActionInvoke(context);
          }else{
            runEvents = false;
            return super.onInvokeActivity(context);
          }
        default:
          runEvents = false;
          return super.onInvokeActivity(context);
      }
    } catch (err) {
      if (err.message === 'NotImplemented') {
        return { status: 501 };
      } else if (err.message === 'BadRequest') {
        return { status: 400 };
      }
      throw err;
    } finally {
      if (runEvents) {
        this.defaultNextEvent(context)();
      }
    }
  }

  defaultNextEvent = (context) => {
    const runDialogs = async () => {
        await this.handle(context, 'Dialog', async () => {
            // noop
        });
    };
    return runDialogs;
}
}

