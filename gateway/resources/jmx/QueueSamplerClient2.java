import java.util.Vector;
import java.util.Arrays;
import org.apache.xmlrpc.*;

public class QueueSamplerClient2
{
  public static void main(String[] args) throws Exception
  {
   
    Vector parameters = new Vector();
    String result = null;
    parameters.addElement("jqueues");
    parameters.addElement("myGroup");

    System.out.println(result);
    parameters.removeElementAt(1);
    parameters.setElementAt("totalQueues", 0);

   
    parameters.setElementAt("queuesOffline", 0);
    
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
     
      parameters.setElementAt("totalQueues", 0);
      parameters.addElement("3");
      
      parameters.setElementAt("queuesOffline", 0);
      parameters.setElementAt("1", 1);
      

      boolean bSendTestData = true; // set to false to switch this part off
      if (bSendTestData)
      {
        parameters.setElementAt("queue2.currentSize", 0);
        for (int ix = 0; ix < 1000; ix++)
        {
          parameters.setElementAt(""+ix, 1);
          
          Thread.sleep(1000);
        }
      }
  }

  private static final int NO_SUCH_SAMPLER = 202;

}