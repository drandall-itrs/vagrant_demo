import java.util.Vector;
import java.util.Arrays;
import org.apache.xmlrpc.*;

public class QueueSamplerClient3
{
  public static void main(String[] args) throws Exception
  {
    if (args.length != 2)
    {
      System.err.println("Usage: QueueSamplerClient serverHost serverPort");
      System.exit(1);
    }

    XmlRpcClient c = new
    XmlRpcClient("http://"+args[0]+":"+args[1]+"/xmlrpc");
    Vector parameters = new Vector();
    String result = null;
    parameters.addElement("jqueues");
    parameters.addElement("myGroup");
    result = (String)c.execute("api.apiSampler.createView",parameters);
    System.out.println(result);
    parameters.removeElementAt(1);
    parameters.setElementAt("totalQueues", 0);

    try
      {
      c.execute("api.apiSampler.myGroup-jqueues.addHeadline",
      parameters);
      }
    catch (XmlRpcException e)
    {
      if (e.code == NO_SUCH_SAMPLER)
      System.out.println("NO_SUCH_SAMPLER");
    }

    parameters.setElementAt("queuesOffline", 0);
    c.execute("api.apiSampler.myGroup-jqueues.addHeadline",parameters);
    String[][] strTable =
    {
      {"queueName","currentSize","maxSize","currentUtilisation","status"},
      {"queue1","332","30000","0.11","online"},
      {"queue2","0","90000","0","offline"},
      {"queue3","7331","45000","0.16","online"}
    };

    Vector table = new Vector();

    for (int ix = 0; ix < strTable.length; ix++)

      table.addElement(new Vector(Arrays.asList(strTable[ix])));
      parameters.setElementAt(table, 0);
      c.execute("api.apiSampler.myGroup-jqueues.updateEntireTable",parameters);
      parameters.setElementAt("totalQueues", 0);
      parameters.addElement("3");
      c.execute("api.apiSampler.myGroup-jqueues.updateHeadline",parameters);
      parameters.setElementAt("queuesOffline", 0);
      parameters.setElementAt("1", 1);
      c.execute("api.apiSampler.myGroup-jqueues.updateHeadline",parameters);

      boolean bSendTestData = true; // set to false to switch this part off
      if (bSendTestData)
      {
        parameters.setElementAt("queue2.currentSize", 0);
        for (int ix = 0; ix < 1000; ix++)
        {
          parameters.setElementAt(""+ix, 1);
          c.execute("api.apiSampler.myGroup-jqueues.updateTableCell", parameters);
          Thread.sleep(1000);
          if (ix == 999) {
            ix = 0;
          }
        }
      }
  }

  private static final int NO_SUCH_SAMPLER = 202;

}
