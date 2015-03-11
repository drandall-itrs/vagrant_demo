import java.util.*;

public class TestHarness
{
	public static void main(String[] args)
	{
		List list = new ArrayList();
		while(true)
		{
			for(int ix = 0; ix < 100; ++ix)
			{
				list.add(buildBigString());
			}
                       System.out.println("Working..."); 
			try{Thread.sleep(2 * 1000);}
			catch(InterruptedException exception){}
		}

	}

	private static String buildBigString()
	{
		String s = "";
		for(int ix = 0; ix < 500; ++ix)
		{
			s += "a";
		}
		return new String(s);
	}
}